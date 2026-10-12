import "./Frame.css";

export default function Frame({ children, icon }) {
    return (
        <div className="drawer-frame">
            <div className="drawer-frame-icon">{icon}</div>
            <div>{children}</div>
        </div>
    );
}
