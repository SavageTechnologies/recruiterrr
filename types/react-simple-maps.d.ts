declare module 'react-simple-maps' {
  import { ReactNode } from 'react'

  export function ComposableMap(props: { projection?: string; style?: any; children?: ReactNode }): JSX.Element
  export function Geographies(props: { geography: string; children: (args: { geographies: any[] }) => ReactNode }): JSX.Element
  export function Geography(props: { key?: string; geography: any; fill?: string; stroke?: string; strokeWidth?: number; style?: any; children?: ReactNode }): JSX.Element
}
