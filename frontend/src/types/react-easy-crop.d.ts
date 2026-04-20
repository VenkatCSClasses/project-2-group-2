declare module 'react-easy-crop' {
  import type { ComponentType } from 'react'

  type Point = {
    x: number
    y: number
  }

  type Area = {
    width: number
    height: number
    x: number
    y: number
  }

  type CropperProps = {
    image: string
    crop: Point
    zoom: number
    aspect?: number
    cropShape?: 'rect' | 'round'
    showGrid?: boolean
    onCropChange: (crop: Point) => void
    onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void
    onZoomChange?: (zoom: number) => void
  }

  const Cropper: ComponentType<CropperProps>

  export default Cropper
}
