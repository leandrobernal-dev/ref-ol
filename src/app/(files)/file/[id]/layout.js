import { createClient } from "@/utils/supabase/server";

export async function generateMetadata({ params }) {
    const supabase = createClient();
    const { data: file } = await supabase
        .from("Files")
        .select("*")
        .eq("id", params.id)
        .single();

    return {
        title: file.name + " - refOnline",
    };
}

export default function FileLayout({ children }) {
    return children;
}
