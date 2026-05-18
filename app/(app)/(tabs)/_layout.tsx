import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabBar } from "../../../components/ui/BottomTabBar";
import { TopBar } from "../../../components/ui/TopBar";
import { COLORS } from "../../../constants/theme";

export default function TabsLayout() {
	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			<TopBar />
			<View style={styles.content}>
				<Tabs
					screenOptions={{
						headerShown: false,
						sceneStyle: { backgroundColor: COLORS.background },
					}}
					tabBar={(props) => <BottomTabBar {...props} />}
				>
					<Tabs.Screen name="index" />
					<Tabs.Screen name="calendar" />
					<Tabs.Screen name="notes" />
					<Tabs.Screen name="wellbeing" />
				</Tabs>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	content: {
		flex: 1,
	},
});
