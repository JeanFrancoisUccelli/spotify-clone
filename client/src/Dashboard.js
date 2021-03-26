import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import Player from "./Player";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Form } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node";
import axios from "axios";
import bg from "./assets/cheers-204742_1920.jpg";

const spotifyApi = new SpotifyWebApi({
  clientId: "d3c499879a5c467097abc6a23d264c11",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();
  const [lyrics, setLyrics] = useState("");

  function chooseTrack(track) {
    setPlayingTrack(track);
    setSearch("");
    setLyrics("");
  }

  useEffect(() => {
    if (!playingTrack) return;

    axios
      .get("http://localhost:3001/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then((res) => {
        setLyrics(res.data.lyrics);
      });
  }, [playingTrack]);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;

    let cancel = false;
    spotifyApi.searchTracks(search).then((res) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image;
              return smallest;
            },
            track.album.images[0],
            track.href
          );

          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
            previewUrl: track.preview_url,
            url: track.href,
          };
        })
      );
    });

    return () => (cancel = true);
  }, [search, accessToken]);

  return (
    <Container
      className="d-flex flex-column py-2"
      style={{ height: "100vh", backgroundImage: `url(${bg})` }}
    >
      <Form.Control
        type="search"
        placeholder="Search Songs/Artists"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div
        className="flex-grow-1 my-2"
        style={{ overflowY: "auto", color: "white" }}
      >
        {searchResults.map((track) => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            chooseTrack={chooseTrack}
          />
        ))}
        {searchResults.length === 0 && (
          <>
            <div
              className="d-flex text-center"
              style={{ color: "white", width: "100%", marginBottom: "20px" }}
            >
              Search an artist or a song and click on a result to see the lyrics
              and listen to a 30s preview
            </div>
            <div
              className="text-center"
              style={{ whiteSpace: "pre", color: "white" }}
            >
              {lyrics}
            </div>
          </>
        )}
      </div>
      <div className="d-flex justify-content-center align-items-center">
        <Player accessToken={accessToken} trackUri={playingTrack?.previewUrl} />
        {/* <audio controls src={playingTrack?.url}></audio> */}
      </div>
    </Container>
  );
}
