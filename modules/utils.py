import tomllib
import requests
import cachetools.func

@cachetools.func.lru_cache()
def get_user_agent() -> str:
    pyproject_path = "pyproject.toml"
    with open(pyproject_path, "rb") as file:
        toml = tomllib.load(file)
    
    name = toml.get("project").get("name")
    version = toml.get("project").get("version")
    url = toml.get("project").get("urls").get("homepage")
    library = requests.utils.default_user_agent()

    return f"{name}/{version} (+{url}) {library}"

@cachetools.func.lru_cache()
def get_request_headers() -> dict[str, str]:
    return {
        "User-Agent": get_user_agent()
    }
