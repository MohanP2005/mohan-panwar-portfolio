/* 
EXAMPLE POSTS. Replace with real posts; each links out to `url` (Substack/Medium/etc.). No per-post pages. The first post in the array is shown as the featured "LATEST" card, the rest in the archive list. 
*/

export const POSTS_ARE_EXAMPLES = true; // set to false once these are real posts

export type Post = { 
    title: string; 
    date: string; 
    readTime: string; 
    excerpt: string; 
    url: string; 
    cover?: string 
};

export const posts: Post[] = [
    {
        title: "Building an auction for restaurant tables",
        date: "2026-10-30",
        readTime: "6 MIN READ",
        excerpt: "Example excerpt. Why the hardest part of tablebid was not the code but getting a restaurant owner to say yes.",
        url: "#"
    },
    {
        title: "Teaching a bot to play my family’s card game",
        date: "2026-11-12",
        readTime: "5 MIN READ",
        excerpt: "Example excerpt.",
        url: "#"
    },
    {
        title: "Three backtests that lied to me",
        date: "2026-12-02",
        readTime: "7 MIN READ",
        excerpt: "Example excerpt.",
        url: "#"
    },
    {
        title: "I threw away my first website",
        date: "2027-01-10",
        readTime: "4 MIN READ",
        excerpt: "Example excerpt.",
        url: "#"
    },
    {
        title: "What I learned pitching 10 restaurants",
        date: "2027-01-24",
        readTime: "6 MIN READ",
        excerpt: "Example excerpt.",
        url: "#"
    }
];
