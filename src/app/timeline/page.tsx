import { TimelineStream } from "./TimelineStream";
import styles from "./timeline.module.css";

export default function TimelinePage() {
  return (
    <main className={styles.timeline} aria-label="Timeline">
      <TimelineStream />
    </main>
  );
}
