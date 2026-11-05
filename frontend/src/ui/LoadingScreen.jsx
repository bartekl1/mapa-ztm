import { Spinner } from "@chakra-ui/react";

import icon from "../assets/img/icon.svg"
import "./LoadingScreen.css";

export default function LoadingScreen({  }) {
    return <div className="loading-screen">
        <img src={icon} />
        <Spinner size="xl" borderWidth="4px" animationDuration="0.8s" />
    </div>;
}
