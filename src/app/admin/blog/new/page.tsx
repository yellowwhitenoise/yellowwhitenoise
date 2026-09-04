import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <BlogEditor
      post={{
        title: "",
        brief: "",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        heroImage: "",
        body: [{ type: "paragraph", text: "" }],
        status: "draft",
        excerpt: "",
        category: "",
        tags: "",
        author: "Yellow White Noise",
        publishedAt: "",
        seoTitle: "",
        seoDescription: "",
        primaryKeyword: "",
        secondaryKeywords: "",
        searchIntent: "",
        articleSummary: "",
        keyTakeaways: "",
        directAnswer: "",
        keyFacts: "",
        entities: "",
        topics: "",
        editorialPerspective: "",
        faq: [],
        sources: [],
        authorTitle: "",
        authorBio: "",
        authorImage: "",
        authorLinks: [],
        imageAlt: "",
        relatedSlugs: "",
        materiallyUpdatedAt: "",
        reviewedAt: "",
      }}
    />
  );
}
