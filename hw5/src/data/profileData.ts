import type { Tweet } from "@/components/TweetCard";

export type Profile = {
  handle: string;
  name: string;
  bio: string;
  location: string;
  joined: string;
  avatarColor: string;
  bannerImage: string;
  stats: {
    posts: number;
    following: number;
    followers: number | string;
  };
  posts: Tweet[];
  likes?: Tweet[];
  isFollowing?: boolean;
};

const darrellPosts: Tweet[] = [
  {
    id: "p1",
    author: {
      name: "Darrell",
      handle: "@darrelldiaz",
      avatarColor: "#7856ff",
      verified: false,
    },
    timestamp: "Oct 11",
    createdAt: Date.UTC(2024, 9, 11, 9, 45),
    content:
      "Learn how to use Cursor Agent with 10 tips:\n\n1. Plan mode\n2. Context menu\n3. Custom commands\n4. Images\n5. Duplicating chats\n6. Context visibility\n7. Usage visibility\n8. Keyboard shortcuts\n9. New chats\n10. Checkpoints\n\nAnd an extra bonus round!",
    stats: {
      replies: 89,
      reposts: 324,
      likes: 3200,
      views: 567_000,
    },
    media: {
      src: "https://images.unsplash.com/photo-1527694224014-b2399a0b954d?auto=format&fit=crop&w=900&q=80",
      alt: "Laptop with code editor open",
    },
  },
  {
    id: "p2",
    author: {
      name: "Cursor",
      handle: "@cursor_ai",
      avatarColor: "#0f1419",
      verified: true,
    },
    timestamp: "Aug 22",
    createdAt: Date.UTC(2024, 7, 22, 14, 15),
    content:
      "You can now launch agents directly from Linear. Try it out and let us know what you build!",
    stats: {
      replies: 105,
      reposts: 433,
      likes: 5100,
      views: 992_000,
    },
    context: "You reposted",
  },
];

const darrellLikes: Tweet[] = [
  {
    id: "l1",
    author: {
      name: "Ben Lang",
      handle: "@benln",
      avatarColor: "#1d9bf0",
      verified: true,
    },
    timestamp: "Oct 23",
    createdAt: Date.UTC(2024, 9, 23, 18, 30),
    content: "Sun room at Cursor's NYC office ☀️",
    media: {
      src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      alt: "Well lit lounge space with sofas",
    },
    stats: {
      replies: 22,
      reposts: 4,
      likes: 348,
      views: 14_000,
    },
  },
  {
    id: "l2",
    author: {
      name: "Ben Lang",
      handle: "@benln",
      avatarColor: "#f91880",
      verified: true,
    },
    timestamp: "Oct 22",
    createdAt: Date.UTC(2024, 9, 22, 11, 5),
    content:
      "Cursor team is stacked on X, shortlist for insider updates:\n\n@ryolu – design\n@ericzakariasson – dev rel\n@TheRohanVarma – product\n@leerob – dev rel\n@JuanRezzio – QA engineering\n@davidrfgomes – engineering\n@austinnickpiel – engineering\n@milichab – product",
    stats: {
      replies: 40,
      reposts: 19,
      likes: 451,
      views: 47_000,
    },
  },
];

const ianPosts: Tweet[] = [
  {
    id: "ian1",
    author: {
      name: "ian",
      handle: "@shaoruu",
      avatarColor: "#f59e0b",
      verified: true,
    },
    timestamp: "Mar 7",
    createdAt: Date.UTC(2024, 2, 7, 20, 0),
    content:
      "One big pro of having a multiplayer personal portfolio: people can get on and build anything they want (sometimes so beautiful ❤️)",
    stats: {
      replies: 58,
      reposts: 104,
      likes: 2600,
      views: 180_000,
    },
    media: {
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      alt: "Stylized concept art",
    },
  },
  {
    id: "ian2",
    author: {
      name: "ian",
      handle: "@shaoruu",
      avatarColor: "#f59e0b",
      verified: true,
    },
    timestamp: "Feb 28",
    createdAt: Date.UTC(2024, 1, 28, 12, 20),
    content:
      "Building new tools at @cursor_ai and @withvoxelize. Experimental, fast, and a little wild.",
    stats: {
      replies: 24,
      reposts: 88,
      likes: 1400,
      views: 89_000,
    },
  },
];

export const PROFILES: Record<string, Profile> = {
  darrelldiaz: {
    handle: "darrelldiaz",
    name: "Darrell",
    bio: "Craving pop culture and building web experiences. STL Cardinals fan.",
    location: "Taipei City, Taiwan",
    joined: "Joined May 2021",
    avatarColor: "#7856ff",
    bannerImage:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    stats: {
      posts: 886,
      following: 243,
      followers: 76,
    },
    posts: darrellPosts,
    likes: darrellLikes,
  },
  shaoruu: {
    handle: "shaoruu",
    name: "ian",
    bio: "building @cursor_ai and @withvoxelize",
    location: "San Francisco",
    joined: "Born December 2 · Joined June 2019",
    avatarColor: "#f59e0b",
    bannerImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    stats: {
      posts: 1130,
      following: 605,
    followers: "20.8K",
  },
    posts: ianPosts,
    isFollowing: true,
  },
  albicelestetalk: {
    handle: "AlbicelesteTalk",
    name: "All About Argentina",
    bio: "Debut call ups, match analysis, and everything Albiceleste 🇦🇷",
    location: "Buenos Aires, Argentina",
    joined: "Joined June 2018",
    avatarColor: "#1d9bf0",
    bannerImage:
      "https://images.unsplash.com/photo-1526402466350-0c2f1f1c6783?auto=format&fit=crop&w=1200&q=80",
    stats: {
      posts: 147400,
      following: 3,
      followers: "2.2M",
    },
    posts: [
      {
        id: "alb1",
        author: {
          name: "All About Argentina",
          handle: "@AlbicelesteTalk",
          avatarColor: "#1d9bf0",
          verified: true,
        },
        timestamp: "22h",
        createdAt: Date.UTC(2025, 10, 7, 10, 30),
        content:
          "Debut call up in the national team: Joaquín Panichelli 🇦🇷⭐",
        media: {
          src: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80",
          alt: "Argentina player smiling in kit",
        },
        stats: {
          replies: 110,
          reposts: 3400,
          likes: 44_000,
          views: 10_000_000,
        },
      },
      {
        id: "alb2",
        author: {
          name: "All About Argentina",
          handle: "@AlbicelesteTalk",
          avatarColor: "#1d9bf0",
          verified: true,
        },
        timestamp: "Sep 30",
        createdAt: Date.UTC(2025, 8, 30, 8, 0),
        content:
          "Matchday! Argentina faces Chile in World Cup qualifiers tonight. Score predictions?",
        stats: {
          replies: 2100,
          reposts: 5600,
          likes: 120_000,
          views: 15_000_000,
        },
      },
    ],
  },
};

export const CURRENT_USER = PROFILES.darrelldiaz;

export function getProfileByHandle(handle: string) {
  return PROFILES[handle.toLowerCase()] ?? null;
}


