# CydiaRepoDownloader
**Simple Cydia Repo installer and parser for NodeJS**

## Usage

### Parse Repository as JSON

    import * as CRD from 'cydiarepodownloader';
    const repoData = await CRD.parseRepo(repoURL);
    // This creates a JSON stingified format. An example is provided in: "example.json" (using the cercube repo)
    /* OUTPUTS:
        onError: false
        onSuccess: true
    /*

### Download Package from Repo

    import * as CRD from 'cydiarepodownloader';
    await CRD.downloadPackageFromRepo(repoURL,packageName, directoryToDownload+"/whatever.deb");
    /* OUTPUTS:
        onError: false
        onSuccess: true
    /*

### Download all Packages from Repo

    import * as CRD from 'cydiarepodownloader';
    await CRD.downloadAllPackagesFromRepo(repoURL, directoryToDownload);
    /* OUTPUTS:
        Errors: ["packagename1","packagename2"]
    /*