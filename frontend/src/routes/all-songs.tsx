import SongList from "#/sections/song-list/song-list";

export default function AllSongs() {
  return (
    <div className="flex h-full flex-col">
      <SongList slug={null} title={null} />
    </div>
  );
}
