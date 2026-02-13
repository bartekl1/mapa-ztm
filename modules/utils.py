import tomllib
import requests
import cachetools.func

@cachetools.func.lru_cache()
def get_pyproject() -> dict:
    pyproject_path = "pyproject.toml"
    with open(pyproject_path, "rb") as file:
        toml = tomllib.load(file)
    return toml

@cachetools.func.lru_cache()
def get_version() -> dict[str, str | None]:
    pyproject = get_pyproject()
    return {
        "version": pyproject.get("project", {}).get("version", None)
    }

@cachetools.func.lru_cache()
def get_user_agent() -> str:
    pyproject = get_pyproject()
    name = pyproject.get("project").get("name")
    version = pyproject.get("project").get("version")
    url = pyproject.get("project").get("urls").get("homepage")
    library = requests.utils.default_user_agent()
    return f"{name}/{version} (+{url}) {library}"

@cachetools.func.lru_cache()
def get_request_headers() -> dict[str, str]:
    return {
        "User-Agent": get_user_agent()
    }
