import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, shared } from '../lib/theme';

const examples = [
  { title: 'Ein Wochenende in Bern', route: 'Bern → Thun', date: '24.–26. Oktober 2026' },
  { title: 'Sommer am See', route: 'Luzern → Weggis', date: '12.–14. Juli 2026' },
];

export default function Preview() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <Text style={shared.eyebrow}>MEINE ERINNERUNGEN</Text>
        <Text style={shared.title}>Pin Map</Text>
        <Text style={styles.intro}>Kleine Auszeiten. Grosse Erinnerungen.</Text>
        <TextInput accessibilityLabel="Beispielreisen suchen" placeholder="Reise suchen" value={search} onChangeText={setSearch} style={shared.input} />
        {examples.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())).map((item) => (
          <Pressable key={item.title} accessibilityRole="button" onPress={() => setSelected(selected === item.title ? null : item.title)} style={styles.card}>
            <Text style={styles.route}>{item.route}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={shared.small}>{item.date}</Text>
            {selected === item.title && <Text style={styles.intro}>Deine Reiseorte und Erinnerungen finden hier ihren Platz.</Text>}
          </Pressable>
        ))}
        <Text style={styles.note}>Oberflaechenentwurf mit Beispieldaten. Eigene Reisen und dauerhafte Speicherung folgen.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: 24, gap: 18 },
  intro: { fontSize: 15, lineHeight: 23, color: '#58645D' },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, gap: 12, borderWidth: 1, borderColor: colors.border },
  route: { fontSize: 13, fontWeight: '700', color: '#65766A' },
  title: { fontSize: 23, fontWeight: '700', color: colors.text },
  note: { color: '#707774', fontSize: 12, lineHeight: 20 },
});
