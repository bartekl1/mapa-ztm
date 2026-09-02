import requests
import cachetools.func

import tomllib

def get_pyproject() -> dict:
    with open("pyproject.toml", "rb") as file:
        toml = tomllib.load(file)
    return toml

@cachetools.func.lru_cache()
def get_project_details() -> dict[str, str]:
    pyproject = get_pyproject()
    return {
        "name": pyproject.get("project", {}).get("name"),
        "version": pyproject.get("project", {}).get("version"),
        "homepage": pyproject.get("project", {}).get("urls", {}).get("homepage")
    }

@cachetools.func.lru_cache()
def get_user_agent() -> str:
    project = get_project_details()
    library = requests.utils.default_user_agent()
    return f"{project['name']}/{project['version']} (+{project['homepage']}) {library}"

@cachetools.func.lru_cache()
def get_request_headers() -> dict[str, str]:
    return {
        "User-Agent": get_user_agent()
    }
