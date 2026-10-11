import { Drawer, CloseButton, Portal } from "@chakra-ui/react";
import { useState, useEffect } from "react";

function DrawerResizer({ setSize, placement }) {
    const width = "5px";

    const pointerDownCallback = () => {
        document.body.style.userSelect = "none";
        const moveCallback = (evt) => {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const newSize = Math.max(placement === "end" ? vw - evt.clientX : vh - evt.clientY, 50);
            setSize(newSize);
        };
        const upCallback = () => {
            document.removeEventListener("pointermove", moveCallback);
            document.removeEventListener("pointerup", upCallback);
            document.body.style.userSelect = "";
        };
        document.addEventListener("pointermove", moveCallback);
        document.addEventListener("pointerup", upCallback);
    };

    return (
        <div style={{
                backgroundColor: "transparent",
                position: "absolute",
                left: placement === "end" ? "-1px" : "0",
                top: placement === "end" ? "0" : "-1px",
                width: placement === "end" ? width : "100%",
                height: placement === "end" ? "100%" : width,
                cursor: placement === "end" ? "ew-resize": "ns-resize",
                touchAction: "none",
            }} onPointerDown={pointerDownCallback}>
        </div>
    );
}

export default function MapDrawer({ children, open, setOpen, title }) {
    const [placement, setPlacement] = useState("end");

    useEffect(() => {
        const callback = () => {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            setPlacement(vw >= 800 ? "end" : "bottom");
        };
        addEventListener("resize", callback);
        callback();

        return () => {
            removeEventListener("resize", callback);
        };
    }, []);

    const [size, setSize] = useState("400px");

    return (
        <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} closeOnInteractOutside={false} modal={false} placement={placement}>
            <Portal>
                <Drawer.Positioner pointerEvents="none">
                    <Drawer.Content w={placement === "end" ? size : null} maxW={placement === "end" ? size : null} h={placement === "bottom" ? size : null} maxH={placement === "bottom" ? size : null}>
                        <Drawer.Header>
                            <Drawer.Title>{title}</Drawer.Title>
                        </Drawer.Header>
                        <Drawer.Body>
                            {children}
                        </Drawer.Body>
                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Drawer.CloseTrigger>
                        <DrawerResizer setSize={setSize} placement={placement}></DrawerResizer>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}
