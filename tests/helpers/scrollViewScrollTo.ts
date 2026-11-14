import { ScrollView } from 'react-native';

export function scrollViewScrollTo(): jest.Mock {
  return (ScrollView.prototype as unknown as { scrollTo: jest.Mock }).scrollTo;
}
