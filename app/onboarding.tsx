import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, View, ViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Step1 from "../components/onboarding/Step1";
import Step2 from "../components/onboarding/Step2";
import Step3 from "../components/onboarding/Step3";

const { width } = Dimensions.get("window");

const ONBOARDING_PAGES = [{ id: "1" }, { id: "2" }, { id: "3" }];

let savedStepIndex = 0;

export default function Onboarding() {
	const [currentIndex, setCurrentIndex] = useState(savedStepIndex);
	const flatListRef = useRef<FlatList>(null);

	const handleNext = () => {
		if (currentIndex < ONBOARDING_PAGES.length - 1) {
			flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
		} else {
			console.log("Onboarding klaar! Door naar Home/Login...");
		}
	};

	const handleBack = () => {
		if (currentIndex > 0) {
			flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
		}
	};

	const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		if (viewableItems.length > 0) {
			const newIndex = viewableItems[0].index ?? 0;
			setCurrentIndex(newIndex);
			savedStepIndex = newIndex;
		}
	}).current;

	const getItemLayout = (_: any, index: number) => ({
		length: width,
		offset: width * index,
		index,
	});

	const renderItem = ({ index }: { index: number }) => {
		if (index === 0) return <Step1 />;
		if (index === 1) return <Step2 />;
		if (index === 2) return <Step3 />;
		return null;
	};

	return (
		<View style={styles.container}>
			<FlatList
				ref={flatListRef}
				data={ONBOARDING_PAGES}
				renderItem={renderItem}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
				keyExtractor={(item) => item.id}
				bounces={false}
				initialScrollIndex={savedStepIndex} // Start de lijst op de opgeslagen index
				getItemLayout={getItemLayout}
			/>

			<SafeAreaView style={styles.footerOverlay} pointerEvents="box-none">
				<View style={styles.footer}>
					{currentIndex > 0 ? (
						<Pressable style={styles.navButton} onPress={handleBack}>
							<Feather name="chevron-left" size={24} color="#354E00" />
						</Pressable>
					) : (
						<View style={{ width: 45 }} />
					)}

					<View style={styles.paginationDots}>
						{ONBOARDING_PAGES.map((_, i) => (
							<View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
						))}
					</View>

					{currentIndex < ONBOARDING_PAGES.length - 1 ? (
						<Pressable style={styles.navButton} onPress={handleNext}>
							<Feather name="chevron-right" size={24} color="#354E00" />
						</Pressable>
					) : (
						<View style={{ width: 45 }} />
					)}
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	footerOverlay: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 24,
		paddingBottom: 10,
	},
	footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	paginationDots: { flexDirection: "row", gap: 6 },
	dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: "#354E00" },
	activeDot: {
		backgroundColor: "#354E00",
		shadowColor: "#2F3E2F",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 4,
		elevation: 8,
	},
	navButton: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1.5, borderColor: "#354E00", justifyContent: "center", alignItems: "center" },
});
