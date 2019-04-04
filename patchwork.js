import { PaperSize, Orientation } from 'penplot';
import { randomFloat } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import clustering from 'density-clustering';
import convexHull from 'convex-hull';
import array from 'new-array';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const center            = [ width / 2, height / 2 ];
  const margin            = 1.5;
  const max_radius        = Math.min(center[0], center[1]) - margin;
  const cluster_count     = 5;
  const fps               = 30;
  const lines             = [];
  setInterval(update, 1000 / fps);

  // Generate the random points
  const point_count = 50000; // Larger number will make more defined results
  let points  = array(point_count).map(() => {
    return randomInCircle(center, max_radius);
  });


  // Clip all the lines to a margin
  // const box = [ margin, margin, width - margin, height - margin ];
  // lines = clipPolylinesToBox(lines, box);

  return {
    draw,
    print,
    background: 'white',
    animate: true,
    // clear: true
  };

  function update() {
    // The generation algorithm
    if (points.length <= cluster_count) return;

    const scan = new clustering.KMEANS();
    const clusters = scan.run(points, cluster_count)
      .filter(c => c.length >= 3);

    if (clusters.length === 0) return;

    // Sort clusters by density
    clusters.sort((a, b) => a.length - b.length);

    const cluster = clusters[0];
    const positions = cluster.map(i => points[i]);

    // Finding the convex hull of the cluster
    const edges = convexHull(positions);
    if (edges.length <= 2) return;

    let path = edges.map(c => positions[c[0]]);
    path.push(path[0]);

    lines.push(path);
    console.log(path);

    points = points.filter(p => !positions.includes(p));
  }

  function draw () {
    context.fillStyle = "white";
    lines.forEach(points => {
      context.beginPath();
      points.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
      context.fill();
    });
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }

  // Helper functions
  function randomInCircle(center, radius) {
    const r = radius * Math.sqrt(Math.random());
    const a = randomFloat(0, 2*Math.PI);
    return [
      center[0] + r * Math.cos(a),
      center[1] + r * Math.sin(a)
    ];
  }
}
