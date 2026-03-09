"use client";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import ProjectCard from "@/components/ProjectCard";
import { api } from "@/lib/api";

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
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    return (
      project.projectName?.toLowerCase().includes(query) ||
      project.industry?.toLowerCase().includes(query) ||
      project.targetConsumer?.toLowerCase().includes(query) ||
      project.refinedProblemStatement?.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      {loading ? (
        <div className="flex items-center justify-center h-full w-full min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : (
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
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

          {/* Project Grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProjects.map((project) => (
              <ProjectCard key={project.projectId} {...project} />
            ))}

            {!loading && filteredProjects.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-12">
                {searchQuery
                  ? `No projects matching "${searchQuery}"`
                  : "No projects yet. Create your first one!"}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
