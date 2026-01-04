import type {
  Dataset,
  Model,
  StyleItem,
  DatasetType,
} from "@/types/chat.types";

import {
  Boxes as IconBrandAbstract,
  Bot as IconBrandOpenai,
  Clock as IconBrandZeit,
} from "lucide-react";

export const MODELS: Model[] = [
  { name: "Auto", icon: IconBrandZeit },
  { name: "Claude Sonnet 4", icon: IconBrandAbstract, badge: "Beta" },
  { name: "GPT-5", icon: IconBrandOpenai, badge: "Beta" },
];

export const STYLES: StyleItem[] = [
  { name: "Normal" },
  { name: "Formal" },
  { name: "Explanatory" },
  { name: "Concise" },
  { name: "Learning", badge: "New" },
];

export const DATASETS: Dataset[] = [
  { type: "audio", title: "Meeting Notes", image: "📝" },
  { type: "ppt", title: "Project Dashboard", image: "📊" },
  { type: "txt", title: "Ideas & Brainstorming", image: "💡" },
  { type: "md", title: "Documentation", image: "📚" },
  { type: "pdf", title: "Goals & Objectives", image: "🎯" },
  { type: "xlsx", title: "Budget Planning", image: "💰" },
  { type: "csv", title: "Team Directory", image: "👥" },
  { type: "md", title: "Technical Specs", image: "🔧" },
  { type: "pdf", title: "Analytics Report", image: "📈" },
];

export const DATASET_TYPE_ORDER: DatasetType[] = [
  "audio",
  "ppt",
  "txt",
  "md",
  "pdf",
  "xlsx",
  "csv",
];
