/// <reference types="next" />
/// <reference types="next/navigation" />
/// <reference types="next/server" />
/// <reference types="node" />

// Add other type declarations
declare module 'js-yaml' {
  export function load(content: string): any;
  export function dump(content: any): string;
}

// Ensure this file is treated as a module
export {}; 