import { createFileRoute } from '@tanstack/react-router';
import { VetDirectory } from '@/components/common/VetDirectory';
import { useTranslation } from '@/hooks/useTranslation';
import { careHead } from '@/lib/care';
export const Route=createFileRoute('/veterinarians/')({ head:()=>careHead('Approved veterinarians','Find approved veterinary professionals who have published their profiles on AgriVet OS.'),component:DirectoryPage });
function DirectoryPage(){ const { t }=useTranslation(); return <section className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">{t('care.directory')}</h1><VetDirectory/></section>; }