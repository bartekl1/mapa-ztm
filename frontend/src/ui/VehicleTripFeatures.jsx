import { Icon } from "@mdi/react";
import {
    mdiPound,
    mdiOpenInNew,
    mdiBus,
    mdiTram,
    mdiHelp,
    mdiArrowUpThin,
    mdiArrowDownThin,
    mdiArrowUpDown,
    mdiWheelchair,
    mdiAirConditioner,
    mdiBicycle,
    mdiBullhorn,
    mdiTicketConfirmation,
    mdiAccountTieHat,
    mdiLightningBolt,
    mdiAccount,
    mdiTicketPercent
} from "@mdi/js";

import { Frame, StopFrame } from "./Frame";

export function FrameVehicleID({ children }) {
    return <Frame icon={<Icon path={mdiPound} />}>
        <div>Numer taborowy:</div>
        <div>{children}</div>
    </Frame>;
}

export function FrameVehicleTram() {
    return <Frame icon={<Icon path={mdiTram} />}>Tramwaj</Frame>;
}

export function FrameVehicleBus() {
    return <Frame icon={<Icon path={mdiBus} />}>Autobus</Frame>;
}

export function FrameVehicleUnknown() {
    return <Frame icon={<Icon path={mdiHelp} />}>Nieznany typ pojazdu</Frame>;
}

export function FrameVehicleHighFloor() {
    return <Frame icon={<Icon path={mdiArrowUpThin} />}>Pojazd wysokopodłogowy</Frame>;
}

export function FrameVehicleLowFloor() {
    return <Frame icon={<Icon path={mdiArrowDownThin} />}>Pojazd niskopodłogowy</Frame>;
}

export function FrameVehicleLowEntry() {
    return <Frame icon={<Icon path={mdiArrowUpDown} />}>Pojazd częściowo niskopodłogowy</Frame>;
}

export function FrameVehicleRamp() {
    return <Frame icon={<Icon path={mdiWheelchair} />}>Rampa</Frame>;
}

export function FrameVehicleAirConditioner() {
    return <Frame icon={<Icon path={mdiAirConditioner} />}>Pojazd klimatyzowany</Frame>;
}

export function FrameVehiclePlaceForBicycles() {
    return <Frame icon={<Icon path={mdiBicycle} />}>Miejsce do przewozu rowerów</Frame>;
}

export function FrameVehicleVoiceAnnouncements() {
    return <Frame icon={<Icon path={mdiBullhorn} />}>Zapowiedzi głosowe</Frame>;
}

export function FrameVehicleTicketMachine() {
    return <Frame icon={<Icon path={mdiTicketConfirmation} />}>Biletomat</Frame>;
}

export function FrameVehicleTicketSalesDriver() {
    return <Frame icon={<Icon path={mdiAccountTieHat} />}>Możliwość zakupu biletu u kierowcy</Frame>;
}

export function FrameVehicleCharger() {
    return <Frame icon={<Icon path={mdiLightningBolt} />}>Ładowarka USB</Frame>;
}

export function FrameTripID({ children }) {
    return <Frame icon={<Icon path={mdiPound} />}>
        <div>ID kursu:</div>
        <div>{children}</div>
    </Frame>;
}

export function FrameTripOperator({ children, url }) {
    return <Frame icon={<Icon path={mdiAccount} />}>
        <div>Przewoźnik:</div>
        <div>
            {url ? 
            <a href={url} target="_blank">{children} <Icon path={mdiOpenInNew} /></a> :
            <span>{children}</span>
            }
        </div>
    </Frame>;
}

export function FrameTripOtherTickets() {
    return <Frame icon={<Icon path={mdiTicketPercent} />}>Na linii nie obowiązuje taryfa ZTM</Frame>;
}

export function FrameStop({ sequence, name, code, zone, time, pickupType, dropOffType, currentSequence, setHighlightedStop }) {
    return <StopFrame
                sequence={sequence}
                name={name}
                code={code}
                zone={zone}
                time={time ? time.split(":").slice(0, 2).join(":") : ""}
                requestStop={pickupType === 3 && dropOffType === 3}
                sequenceType={{"-1": "past", "0": "current", "1": "next"}[String(Math.sign(sequence-currentSequence))]}
                setHighlightedStop={setHighlightedStop}
            />;
}
