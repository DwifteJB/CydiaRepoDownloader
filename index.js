import fetch from 'node-fetch';
import * as fs from 'fs';
import * as util from 'util';
import * as stream from 'stream';
import * as Bunzip from 'seek-bzip';
import * as debianCtrl from 'debian-control';
const streamPipeline = util.promisify(stream.pipeline);
// const headers = {
//     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36'
// }
const headers = {"X-Machine": "iPhone13,4","X-Firmware": "15.0","Proxy-Connection": "keep-alive","Cache-Control": "max-age=0","User-Agent": "Telesphoreo APT-HTTP/1.0.592","X-Unique-ID": "iLikeBlueBabyyy","Connection": "keep-alive"}
export async function getRepoImage(repoURL) {
    return await fetch(repoURL+"/CydiaIcon.png", {
        headers: headers
    }); 
}
export async function downloadPackageFromRepo(repoURL, packageName, downloadLocation) {
    const repo = await this.parseRepo(repoURL);
    const repoDownload = JSON.parse(repo);
    for (var pkg in repoDownload.packages) {
        if (repoDownload.packages[pkg].Name.toLowerCase() == packageName.toLowerCase()) {
            // found package!
            // time to download!
            try {
                const response = await fetch(repoDownload.packages[pkg].Filename, {
                    headers: headers
                });
                await streamPipeline(response.body,fs.createWriteStream(downloadLocation));
                return true;
            } catch (e) {
                console.log(e)
                return false;
            }
        }
    }
}
export async function downloadAllPackagesFromRepo(repoURL, downloadLocation) {
    console.log("Downloading all packages to: " + downloadLocation);
    const repoDownload = JSON.parse(await this.parseRepo(repoURL));
    let errors = []
    for (var pkg in repoDownload.packages) {
        try {
            const response = await fetch(repoDownload.packages[pkg].Filename, {
                headers: headers
            });
            await streamPipeline(response.body,fs.createWriteStream(downloadLocation + `/${repoDownload.packages[pkg].Name}-${repoDownload.packages[pkg].Version}.deb`));
        } catch(e) {
            try {
                const response = await fetch(repoURL + repoDownload.packages[pkg].Filename, {
                    headers: headers
                });
                await streamPipeline(response.body,fs.createWriteStream(downloadLocation + `/${repoDownload.packages[pkg].Name}-${repoDownload.packages[pkg].Version}.deb`));
            } catch (e) {
                console.log(e)
                errors.push(repoDownload.packages[pkg].Name);
            }
  
        }
    }
    return errors;
}
export async function parseRepo(repoURL) {
    let skip = false;
    const tempDir = fs.mkdtempSync("repoDownloader")
    try {
        const response = await fetch(repoURL+"/Packages", {
            headers: headers
        })
        await streamPipeline(response.body,fs.createWriteStream(tempDir + "/repo.pkgs"));
        skip = true
    } catch (e) {
        // Not procursus, so skip.
        skip = false
    }
    if (skip == false) {
        try {
            const response = await fetch(repoURL+"/Packages.bz2", {
                headers: headers
            })
            await streamPipeline(response.body,fs.createWriteStream(tempDir + "/Packages.bz2"));

        } catch (e) {
            console.log(`[ ERROR ]: Repo had an error downloading the BZ2.`);
            return false;
        }
        // Unzip BZ2
        try {
            var compressedData = fs.readFileSync(tempDir + "/Packages.bz2")
            var decompressed = Bunzip.default.decode(compressedData);
            fs.writeFileSync(tempDir + "/repo.pkgs", decompressed);
        } catch (e) {
            console.log("[ ERROR ]: Couldn't unzip BZ2.");
            return false
        }
    } 
    // Now that the BZ2 has been decompressed to pkgs, we need to read those pkgs
    let pkgs = fs.readFileSync(tempDir + "/repo.pkgs").toString();
    pkgs = pkgs.replace('Filename: ./debs', `Filename: ${repoURL}/debs`)
    pkgs = pkgs.replace('Filename: ./deb', `Filename: ${repoURL}/deb`)
    pkgs = pkgs.replace('Filename: deb', `Filename: ${repoURL}/deb`)
    pkgs = pkgs.replace('Filename: debs', `Filename: ${repoURL}/debs`)
    pkgs = pkgs.replace('Filename: api', `Filename: ${repoURL}/api`)
    pkgs = pkgs.replace('Filename: pool', `Filename: ${repoURL}/pool`)
    pkgs = pkgs.replace('Filename: files', `Filename: ${repoURL}/files`)
    pkgs = pkgs.replace('Filename:./debs', `Filename: ${repoURL}/debs`)
    pkgs = pkgs.replace('Filename:./deb', `Filename: ${repoURL}/deb`)
    pkgs = pkgs.replace('Filename:deb', `Filename: ${repoURL}/deb`)
    pkgs = pkgs.replace('Filename:debs', `Filename: ${repoURL}/debs`)
    pkgs = pkgs.replace('Filename:api', `Filename: ${repoURL}/api`)
    pkgs = pkgs.replace('Filename:pool', `Filename: ${repoURL}/pool`)
    pkgs = pkgs.replace('Filename:files/', `Filename: ${repoURL}/files`)
    pkgs = pkgs.replace('�', ' ');
    let data = {"url": repoURL,"packages": []};
    // Parse that control file.
    const packages = pkgs.split(/(\n\n)/g).filter((p) => p.trim());
    for (var pkgzs in packages) {
        let parsedData = debianCtrl.parse(packages[pkgzs]);
        data.packages.push(parsedData);
    }
    fs.rmSync(tempDir,{ recursive: true, force: true});
    return JSON.stringify(data,null,2);
}