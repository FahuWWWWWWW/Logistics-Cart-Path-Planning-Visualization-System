/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

// Web Serial API 类型声明
interface SerialPort {
  open(options: SerialPortOpenOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

interface SerialPortOpenOptions {
  baudRate: number;
  dataBits?: 7 | 8 | 9;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
}

interface Navigator {
  serial: {
    requestPort(options?: any): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  };
}
