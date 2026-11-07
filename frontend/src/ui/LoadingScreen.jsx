import { Spinner, Alert } from "@chakra-ui/react";

import icon from "../assets/img/icon.svg"
import "./LoadingScreen.css";

export default function LoadingScreen({ error }) {
    const errors = {
        connection: {
            title: "Błąd połączenia",
            description: "Nie można połączyć się z serwerem. Spróbuj ponownie później.",
        },
        vehicles: {
            title: "Błąd wczytywania pojazdów",
            description: "Nie udało się wczytać lokalizacji pojazdów. Spróbuj ponownie później.",
        },
        offline: {
            title: "Offline",
            description: "Jesteś w trybie offline. Aby korzystać z aplikacji należy połączyć się z Internetem.",
        },

        default: {
            title: "Błąd",
            description: "Wystąpił błąd."
        }
    };

    return <div className="loading-screen">
        <img src={icon} />

        { !error && <>
            <Spinner size="xl" borderWidth="4px" animationDuration="0.8s" />
            <div className="loading-text">Ładowanie aplikacji...</div>
        </> }

        { error && <>
            <Alert.Root className="error-alert" status="error" variant="surface">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title> {(errors[error] ?? errors.default).title} </Alert.Title>
                    <Alert.Description> {(errors[error] ?? errors.default).description} </Alert.Description>
                </Alert.Content>
            </Alert.Root>
        </> }
    </div>;
}
