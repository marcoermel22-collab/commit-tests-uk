import { TextInput, type TextInputProps } from 'react-native';
import { shared } from '../lib/theme';

// Gleiche Darstellung und Tastatur in Reiseformular und Tagebucheintrag.
export default function DateInput(props: TextInputProps) {
  return <TextInput placeholder="TT.MM.JJJJ" keyboardType="numbers-and-punctuation" {...props} style={[shared.input, props.style]} />;
}
