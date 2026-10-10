export function getRouteType(type_enum) {
    if (type_enum == 0) return "tram";
    if (type_enum == 3) return "bus";
    return "unknown";
}
