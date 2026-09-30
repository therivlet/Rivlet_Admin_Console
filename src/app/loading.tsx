import RivletLoader from '@/components/brand/RivletLoader';

export default function Loading() {
  return (
    <RivletLoader 
      fullscreen={true}
      message="Loading Console Workspace..."
      subMessage="Rivlet • Tirupur Sourcing Network"
    />
  );
}
