import React, { useEffect, useRef } from 'react';
import * as d3Base from 'd3';
import { MemoryGraphData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

// Cast d3 to any to bypass type definition issues
const d3: any = d3Base;

interface MemoryGraphProps {
  data: MemoryGraphData;
}

const MemoryGraph: React.FC<MemoryGraphProps> = ({ data }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to render the graph
  const renderGraph = () => {
    if (!svgRef.current || !containerRef.current || data.nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // Theme Colors
    const isDark = theme === 'dark';
    const linkColor = isDark ? "#4b5563" : "#d1d5db";
    const nodeStroke = isDark ? "#fff" : "#fff";
    const textColor = isDark ? "#e5e7eb" : "#374151";

    // Clear previous render to prevent duplication during resize
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Simulation setup
    const simulation = d3.forceSimulation(data.nodes as any[])
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.val || 5) + 10));

    // Render links
    const link = svg.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value || 1));

    // Render nodes
    const node = svg.append("g")
      .attr("stroke", nodeStroke)
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", (d: any) => d.val || 5)
      .attr("fill", (d: any) => {
        // Vibrant colors for dark mode, slightly muted or same for light mode
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
        return colors[(d.group || 1) % colors.length];
      })
      .call(drag(simulation) as any);

    // Render labels
    const text = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((d: any) => d.label)
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", textColor)
      .attr("dx", 12)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      text
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return simulation;
  };

  useEffect(() => {
    let simulation = renderGraph();

    const resizeObserver = new ResizeObserver(() => {
      if (simulation) simulation.stop();
      simulation = renderGraph();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (simulation) simulation.stop();
      resizeObserver.disconnect();
    };
  }, [data, theme]); // Re-render when theme changes

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative transition-colors duration-200">
      <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-gray-900/80 p-2 rounded border border-gray-200 dark:border-gray-800 backdrop-blur-sm pointer-events-none shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.memory.legend}</h3>
        <div className="flex flex-col gap-1 text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> {t.memory.core_values}</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> {t.memory.projects}</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> {t.memory.tasks}</div>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
};

export default MemoryGraph;