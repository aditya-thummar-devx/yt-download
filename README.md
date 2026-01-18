# YouTube Media Downloader

A Node.js application for downloading YouTube videos and playlists in various formats with organized directory structure.

## Features

- **Multiple Format Support**: Download videos as MP4 or audio as WAV
- **Playlist Support**: Download entire playlists or individual videos
- **Organized Storage**: Automatic directory organization by format and date
- **Smart Naming**: Extracts playlist names automatically from YouTube metadata
- **Modern ES6+**: Clean, modern JavaScript code with proper error handling

## Supported Download Options

1. **Video MP4** - Download single video in MP4 format
2. **Video Playlist MP4** - Download entire playlist in MP4 format
3. **Audio WAV** - Download single video audio in WAV format
4. **Audio Playlist WAV** - Download entire playlist audio in WAV format

## Directory Structure

### Single Files
```
downloaded-media/
├── MP4/
│   └── 2026-01-18T11-59-59-999Z/
│       └── video-file.mp4
└── WAV/
    └── 2026-01-18T11-59-59-999Z/
        └── audio-file.wav
```

### Playlists
```
download/
└── 2026-01-18/
    └── playlist-name/
        ├── video-1.mp4
        ├── video-2.mp4
        ├── video-3.mp4
        └── video-4.mp4
```

## Prerequisites

- **Node.js** (v14 or higher)
- **yt-dlp** (must be installed and available in PATH)
- **yarn** or **npm** package manager

### Optional: Cookie Setup (for age-restricted content)

To download age-restricted or private videos, you can add your YouTube cookies:

1. **Install a cookie exporter extension**:
   - Chrome: [Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. **Export your cookies**:
   - Go to youtube.com and make sure you're logged in
   - Click the extension icon
   - Export cookies for `youtube.com`
   - Save as `cookies.txt` in the project root

3. **File format**: Your cookies.txt should contain lines like:
   ```
   .youtube.com\tTRUE\t/\tTRUE\t1699999999\tCONSENT\tYES+123
   .youtube.com\tTRUE\t/\tTRUE\t1699999999\tVISITOR_INFO1_LIVE\tabc123def456
   ```

**⚠️ Security Note**: Never share your cookies.txt file as it contains your login session!

### Installing yt-dlp

**macOS (Homebrew):**
```bash
brew install yt-dlp
```

**Linux (apt):**
```bash
sudo apt update
sudo apt install yt-dlp
```

**Windows (pip):**
```bash
pip install yt-dlp
```

Or download from [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)

## Installation

1. Clone or download this project
2. Install dependencies:

```bash
yarn install
# or
npm install
```

## Usage

1. **Start the application:**

Using npm/yarn:
```bash
yarn start
# or
npm start
```

Or directly with Node.js:
```bash
node download-videos.js
```

2. **Choose download option:**

```
Choose download option:
1. Video MP4
2. Video Playlist MP4
3. Audio WAV
4. Audio Playlist WAV
Enter option number (1-4):
```

3. **Enter YouTube URL:**

```
Enter YouTube URL: https://www.youtube.com/watch?v=...
```

4. **Wait for download to complete**

### Examples

**Download single video as MP4:**
- Choose option 1
- Enter: `https://www.youtube.com/watch?v=VIDEO_ID`

**Download playlist as audio WAV:**
- Choose option 4
- Enter: `https://www.youtube.com/playlist?list=PLAYLIST_ID`

## File Locations

- **Single videos/audio**: `downloaded-media/{FORMAT}/{TIMESTAMP}/`
- **Playlists**: `download/{DATE}/{PLAYLIST_NAME}/`

## Dependencies

- **child_process**: For spawning yt-dlp processes
- **readline**: For user input handling
- **fs**: For file system operations
- **path**: For path manipulation

## Error Handling

The application includes comprehensive error handling for:
- Invalid YouTube URLs
- Network connectivity issues
- File system permissions
- yt-dlp execution errors
- User input validation

## Development

### Code Structure

- **ES6+ Modern JavaScript**: Arrow functions, const/let, template literals
- **Async/Await**: Proper asynchronous operations
- **Modular Functions**: Separated concerns for readability
- **Error Handling**: Comprehensive error catching and reporting

### Key Functions

- `askQuestion(question)`: Promisified user input
- `extractPlaylistName(url)`: Extracts playlist name from YouTube
- `createDownloadDirectory(format, isPlaylist, playlistName)`: Creates organized directories
- `downloadVideo(url, downloadDir, isPlaylist, format)`: Handles the actual download
- `main()`: Application entry point and user interface

## Troubleshooting

### Common Issues

1. **"yt-dlp not found"**: Install yt-dlp and ensure it's in PATH
2. **Permission errors**: Check write permissions in download directories
3. **Invalid URL**: Ensure YouTube URL is correct and accessible
4. **Network issues**: Check internet connectivity

### Debug Mode

For troubleshooting, you can add debug logging by modifying the download function.

## License

This project is for educational and personal use. Ensure you comply with YouTube's Terms of Service when using this tool.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Disclaimer

This tool is intended for personal use and educational purposes. Users are responsible for ensuring they have the right to download content and comply with all applicable laws and YouTube's Terms of Service.

---

**Note**: Always respect copyright laws and content creators' rights when downloading content from YouTube.