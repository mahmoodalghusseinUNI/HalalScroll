import * as React from 'react';

import { HalalScreenTimeViewProps } from './HalalScreenTime.types';

export default function HalalScreenTimeView(props: HalalScreenTimeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
