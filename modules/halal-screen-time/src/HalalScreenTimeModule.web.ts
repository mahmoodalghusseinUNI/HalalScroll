import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './HalalScreenTime.types';

type HalalScreenTimeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class HalalScreenTimeModule extends NativeModule<HalalScreenTimeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(HalalScreenTimeModule, 'HalalScreenTimeModule');
