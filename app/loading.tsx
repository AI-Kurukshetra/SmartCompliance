import { BrandLoader } from "@/components/ui/brand-loader";

export default function Loading() {
  return (
    <main className="shell-grid min-h-screen px-6 py-10">
      <section className="panel mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center rounded-[2rem]">
        <BrandLoader label="Preparing compliance workspace" />
      </section>
    </main>
  );
}
