import RivletLoader from '@/components/brand/RivletLoader';

export default function Loading() {
  return (
    <RivletLoader 
      fullscreen={true}
      message="Loading Console Workspace..."
      subMessage="Rivlet Luxury Apparel Co. • Tirupur Production Hub"
    />
  );
}
