import { PrismaClient, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting database…");

  await prisma.notification.deleteMany();
  await prisma.postRepost.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postStat.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users…");
  await prisma.user.createMany({
    data: [
      {
        id: "user_darrell",
        handle: "darrelldiaz",
        displayName: "Darrell Diaz",
        bio: "Craving pop culture and building web experiences. STL Cardinals fan.",
        location: "Taipei City, Taiwan",
        avatarUrl:
          "https://avatars.githubusercontent.com/u/1?v=4",
        bannerUrl:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "user_albi",
        handle: "AlbicelesteTalk",
        displayName: "All About Argentina",
        bio: "Your source for everything Albiceleste 🇦🇷",
        location: "Buenos Aires, Argentina",
      },
      {
        id: "user_stl",
        handle: "STLSprtsCntrl",
        displayName: "STL Sports Central",
        bio: "Latest news and highlights from St. Louis sports.",
        location: "St. Louis, MO",
      },
      {
        id: "user_cursor",
        handle: "cursor_ai",
        displayName: "Cursor",
        bio: "AI-powered developer tools and updates.",
        location: "San Francisco, CA",
      },
    ],
  });

  console.log("Seeding posts…");
  const postsData = [
    {
      id: "post_albi_panichelli",
      authorId: "user_albi",
      content:
        "Debut call up in the national team: Joaquín Panichelli 🇦🇷⭐",
      createdAt: new Date("2025-10-07T10:30:00Z"),
    },
    {
      id: "post_stl_roster",
      authorId: "user_stl",
      content:
        "The #STLCards made a series of roster moves today, headlined by outfielder Michael Siani being claimed off waivers by the Braves.",
      createdAt: new Date("2025-10-07T13:05:00Z"),
    },
    {
      id: "post_darrell_builder",
      authorId: "user_darrell",
      content:
        "Cooking up a new social experience. Building an X-inspired interface with Next.js and Tailwind. 🚀",
      createdAt: new Date("2025-10-07T18:55:00Z"),
    },
    {
      id: "post_darrell_reply_panichelli",
      authorId: "user_darrell",
      content: "Watching his highlights now — pure energy! Vamos 🇦🇷",
      inReplyToId: "post_albi_panichelli",
      createdAt: new Date("2025-10-07T15:12:00Z"),
    },
    {
      id: "post_cursor_reply_panichelli",
      authorId: "user_cursor",
      content:
        "We indexed his match stats — acceleration off the charts. 🔍",
      inReplyToId: "post_albi_panichelli",
      createdAt: new Date("2025-10-07T16:48:00Z"),
    },
    {
      id: "post_albi_reply_builder",
      authorId: "user_albi",
      content: "Send the beta link, Darrell. Curious to try it out! 👀",
      inReplyToId: "post_darrell_builder",
      createdAt: new Date("2025-10-07T19:40:00Z"),
    },
    {
      id: "post_stl_game_thread",
      authorId: "user_stl",
      content:
        "Game thread: Blues vs. Wild — puck drops in 30 minutes. Predictions?",
      createdAt: new Date("2025-10-07T23:05:00Z"),
    },
    {
      id: "post_cursor_release",
      authorId: "user_cursor",
      content:
        "Cursor v0.42 just shipped! Faster context switching and brand new agent workflows.",
      createdAt: new Date("2025-10-06T21:30:00Z"),
    },
  ];

  for (const post of postsData) {
    await prisma.post.create({ data: post });
  }

  console.log("Seeding interactions…");
  const postLikes = [
    { userId: "user_darrell", postId: "post_albi_panichelli" },
    { userId: "user_stl", postId: "post_albi_panichelli" },
    { userId: "user_albi", postId: "post_darrell_builder" },
    { userId: "user_cursor", postId: "post_darrell_builder" },
    { userId: "user_darrell", postId: "post_cursor_release" },
    { userId: "user_albi", postId: "post_stl_roster" },
    { userId: "user_cursor", postId: "post_stl_roster" },
  ];
  await prisma.postLike.createMany({ data: postLikes });

  const postReposts = [
    { userId: "user_darrell", postId: "post_albi_panichelli" },
    { userId: "user_albi", postId: "post_cursor_release" },
    { userId: "user_cursor", postId: "post_stl_game_thread" },
  ];
  await prisma.postRepost.createMany({ data: postReposts });

  console.log("Seeding follows…");
  const follows = [
    { followerId: "user_darrell", followedId: "user_albi" },
    { followerId: "user_darrell", followedId: "user_stl" },
    { followerId: "user_albi", followedId: "user_darrell" },
    { followerId: "user_cursor", followedId: "user_darrell" },
  ];
  await prisma.follow.createMany({ data: follows });

  console.log("Seeding drafts…");
  const drafts = [
    {
      id: "draft_darrell_nextauth",
      authorId: "user_darrell",
      content:
        "Experimenting with NextAuth + Postgres integration. Notes coming soon.",
    },
    {
      id: "draft_albi_preview",
      authorId: "user_albi",
      content:
        "Preview: Five youngsters to watch in Argentina's friendly vs Chile.",
    },
  ];
  await prisma.draft.createMany({ data: drafts });

  console.log("Seeding post stats…");
  const postStats = [
    {
      postId: "post_albi_panichelli",
      replyCount: 2,
      repostCount: 1,
      likeCount: 2,
      viewCount: 1_000_000,
    },
    {
      postId: "post_stl_roster",
      replyCount: 0,
      repostCount: 0,
      likeCount: 2,
      viewCount: 180_000,
    },
    {
      postId: "post_darrell_builder",
      replyCount: 1,
      repostCount: 0,
      likeCount: 2,
      viewCount: 34_000,
    },
    {
      postId: "post_darrell_reply_panichelli",
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      viewCount: 2_100,
    },
    {
      postId: "post_cursor_reply_panichelli",
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      viewCount: 1_600,
    },
    {
      postId: "post_albi_reply_builder",
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      viewCount: 980,
    },
    {
      postId: "post_stl_game_thread",
      replyCount: 0,
      repostCount: 1,
      likeCount: 0,
      viewCount: 52_000,
    },
    {
      postId: "post_cursor_release",
      replyCount: 0,
      repostCount: 1,
      likeCount: 1,
      viewCount: 210_000,
    },
  ];
  await prisma.postStat.createMany({ data: postStats });

  console.log("Seeding notifications…");
  const notifications = [
    {
      id: "notif_like_panichelli",
      recipientId: "user_albi",
      actorId: "user_darrell",
      type: NotificationType.LIKE,
      postId: "post_albi_panichelli",
      metadata: { preview: "Debut call up in the national team…" },
    },
    {
      id: "notif_repost_release",
      recipientId: "user_cursor",
      actorId: "user_albi",
      type: NotificationType.REPOST,
      postId: "post_cursor_release",
    },
    {
      id: "notif_reply_builder",
      recipientId: "user_darrell",
      actorId: "user_albi",
      type: NotificationType.REPLY,
      postId: "post_darrell_builder",
      metadata: { replyId: "post_albi_reply_builder" },
    },
    {
      id: "notif_follow_darrell",
      recipientId: "user_darrell",
      actorId: "user_cursor",
      type: NotificationType.FOLLOW,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({ data: notification });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

