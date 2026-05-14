import { requireNativeView } from 'expo';
import * as React from 'react';

import { HalalScreenTimeViewProps } from './HalalScreenTime.types';

const NativeView: React.ComponentType<HalalScreenTimeViewProps> =
  requireNativeView('HalalScreenTime');

export default function HalalScreenTimeView(props: HalalScreenTimeViewProps) {
  return <NativeView {...props} />;
}
