import { Slot } from "expo-router";
import { SessionProvider } from "../context";

export default function RootLayout() {
	return (
		<SessionProvider>
			<Slot />
		</SessionProvider>
	);
}
