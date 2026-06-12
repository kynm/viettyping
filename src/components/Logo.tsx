import Image from 'next/image';

interface LogoProps {
  className?: string;
  priority?: boolean;
}

export default function Logo({
  className = 'h-auto w-40',
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/assets/easytyping-logo.png"
      alt="EasyTyping"
      width={1536}
      height={1024}
      className={`${className} object-contain select-none`}
      priority={priority}
    />
  );
}
