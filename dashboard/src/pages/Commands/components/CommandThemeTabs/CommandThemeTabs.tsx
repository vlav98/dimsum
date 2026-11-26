import ContentCard from '../../../../components/common/ContentCard/ContentCard';
import TabList from '../../../../components/common/TabList/TabList';

export default function CommandThemeTabs({
  categories,
  category,
  onChange,
}: {
  categories: string[];
  category: string;
  onChange: (category: string) => void;
}) {
  return (
    <ContentCard>
      <h2>Commands</h2>
      <TabList
        label="Command themes"
        className="command-tabs"
        tabClassName="secondary-button"
        idPrefix="theme"
        panelId="command-theme-panel"
        tabs={categories.map((name) => ({ value: name, label: name }))}
        value={category}
        onChange={onChange}
      />
    </ContentCard>
  );
}
