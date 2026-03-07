"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import ProjectCard from "@/components/ProjectCard";
import {api} from "@/lib/api";
interface Project {
  projectId: string;
  projectName?: string;
  industry?: string;
  targetConsumer?: string;
  refinedProblemStatement?: string;
  questions?: string[];
  createdAt?: string;
}

export default function Dashboard() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  async function fetchProjects() {
    try {
      const data = await api.getProjects();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);
  return (
    <AppLayout>
      {loading && <p>Loading...</p>}
      <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold mb-1">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your insight research projects
          </p>
        </motion.div>

        {/* Actions bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
        >
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filter
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs bg-gradient-warm text-accent-foreground hover:opacity-90 transition-opacity"
              onClick={() => router.push("/new-project")}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Project
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Projects", value: "5" },
            { label: "Exploring", value: "2" },
            { label: "Validating", value: "1" },
            { label: "Ready", value: "1" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Project Grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {projects.map((project) => (
            <ProjectCard key={project.projectId} {...project} />
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
}
