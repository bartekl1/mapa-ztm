import { simpleGit } from "simple-git";
import toml from "toml";
import fs from "fs";

async function getGitInfo() {
    const git = simpleGit();
    
    const log = await git.log();
    const hash = log.latest.hash.substring(0, 7);

    const status = await git.status();
    const modified = status.files.length > 0;

    return {hash: hash, modified: modified};
}

function getPyprojectInfo() {
    const tomlFileRaw = fs.readFileSync("../pyproject.toml").toString();
    const tomlFile = toml.parse(tomlFileRaw);
    
    return {
        name: tomlFile.project.name,
        version: tomlFile.project.version,
        description: tomlFile.project.description,
        license: tomlFile.project.license,
        author: tomlFile.project.authors[0].name,
        repo: tomlFile.project.urls.source,
        issues: tomlFile.project.urls.issues,
        changelog: tomlFile.project.urls.changelog,
        pythonDependencies: tomlFile.project.dependencies.map(dep => dep.match(/([\w\-]*)(?: \(){0,1}(?:(?:==)|(?:>=)|(?:<=)|<|>)\d+\.\d+\.\d+(?:,(?:(?:==)|(?:>=)|(?:<=)|<|>)\d+\.\d+\.\d+\)){0,1}\){0,1}/)[1]),
    };
}

function getPackageJsonInfo() {
    const jsonFileRaw = fs.readFileSync("package.json").toString();
    const jsonFile = JSON.parse(jsonFileRaw);

    return {
        nodeDependencies: Object.keys(jsonFile.dependencies).concat(Object.keys(jsonFile.devDependencies)),
    };
}

async function main() {
    const gitInfo = await getGitInfo();
    const pyprojectInfo = getPyprojectInfo();
    const packageJsonInfo = getPackageJsonInfo();
    const fullInfo = Object.assign(gitInfo, pyprojectInfo, packageJsonInfo);
    const fileContent = "export default " + JSON.stringify(fullInfo, null, "    ") + ";";
    fs.writeFileSync("src/appInfo.js", fileContent);
    console.log("\x1b[0;32m✓ Application information saved to src/appInfo.js\x1b[0m");
}

main();
