import { Icon } from "@mdi/react";
import { mdiAlertBoxOutline } from "@mdi/js";

import "./Frame.css";

export function Frame({ children, icon }) {
    return (
        <div className="drawer-frame">
            <div className="drawer-frame-icon">{icon}</div>
            <div>{children}</div>
        </div>
    );
}

export function StopFrame({ sequence, name, code, zone, time, requestStop, sequenceType }) {
    return (
        <div className="drawer-frame drawer-stop-frame">
            <div className={`drawer-frame-icon stop-${sequenceType}`}>{sequence}</div>
            <div>
                <div>{name}</div>
                <div>
                    {code}
                    {" \u2022 "}
                    {zone}
                    {requestStop && <>
                        {" \u2022 "}
                        <Icon path={mdiAlertBoxOutline} />
                    </>}
                </div>
            </div>
            <div>{time}</div>
        </div>
    );
}
