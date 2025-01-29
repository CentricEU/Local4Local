import { ScrollView, View, Image, Text, Pressable } from "react-native";
import styles from "@/__styles__/change-language-style";
import { useTranslation } from "react-i18next";
import { Divider, Icon } from "react-native-paper";
import { Fragment } from "react";
import colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import paperIcons from "@/constants/paper-icons";

export default function ChangeLanguage() {
	const { i18n, t } = useTranslation('common');

	const languages = [
		{
			title: 'en',
			icon: require('@/assets/flags/en.png')
		},
		{
			title: 'nl',
			icon: require('@/assets/flags/nl.png')
		},
		{
			title: 'de',
			icon: require('@/assets/flags/de.png')
		}
	];

	const setLanguage = async (language: string) => {
		await i18n.changeLanguage(language);

		try {
			await AsyncStorage.setItem('language', language);
		} catch (e) {
			console.log(e);
		}
	}

	return (
		<View style={styles.container}>
			<ScrollView style={styles.list}>
				{languages.map((entry, index) => (
					<Fragment key={index}>
						<Pressable style={styles.listEntry} onPress={() => setLanguage(entry.title)}>
							<View style={styles.flagContainer}>
								<Image source={entry.icon} style={styles.flag} />
							</View>
							<Text style={styles.languageTitle}>
								{t(`language.${entry.title}`)}
							</Text>
							{i18n.language === entry.title &&
								<Icon source={paperIcons.CHECK} size={24} color={colors.SUCCESS_200} />}
						</Pressable>
						<Divider style={styles.listDivider} />
					</Fragment>
				))}
			</ScrollView>
		</View>
	);
}