const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

const extractPlaylistName = async (url) => {
  return new Promise((resolve) => {
    const ytDlpArgs = [
      '--print', '%(playlist_title)s',
      '--no-download',
      '--playlist-items', '1', // Only process the first video to get playlist metadata
      '--socket-timeout', '5', // Set socket timeout to 5 seconds
      '--no-check-certificates', // Bypass SSL certificate verification (fixes macOS SSL issues)
      url
    ];
    
    // Add cookies if available for playlist name extraction too
    if (hasCookies()) {
      ytDlpArgs.push('--cookies', 'cookies.txt');
    }
    
    const ytDlp = spawn('yt-dlp', ytDlpArgs);
    
    let playlistName = '';
    let timeoutId = null;
    
    // Set a timeout to prevent hanging on large playlists
    timeoutId = setTimeout(() => {
      if (ytDlp) {
        ytDlp.kill();
      }
      resolve('playlist'); // Fallback to default name
    }, 8000); // 8 second timeout
    
    ytDlp.stdout.on('data', (data) => {
      // Only capture the first chunk of data to avoid multiple appends
      if (!playlistName) {
        playlistName = data.toString().trim();
        
        // If we got a valid playlist name, clear the timeout and resolve early
        if (playlistName && playlistName !== 'NA' && playlistName !== 'None') {
          clearTimeout(timeoutId);
          
          // Clean up the playlist name for use in directory names
          const cleanName = playlistName
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '-')         // Replace spaces with hyphens
            .toLowerCase()
            .substring(0, 50);            // Limit length to 50 characters
          
          ytDlp.kill(); // Stop processing further videos
          resolve(cleanName || 'playlist');
        }
      }
    });
    
    ytDlp.stderr.on('data', () => {
      // Ignore stderr for this operation
    });
    
    ytDlp.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0 && playlistName?.trim() && playlistName !== 'NA' && playlistName !== 'None') {
        // Clean up the playlist name for use in directory names
        const cleanName = playlistName
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '-')         // Replace spaces with hyphens
          .toLowerCase()
          .substring(0, 50);            // Limit length to 50 characters
        resolve(cleanName || 'playlist');
      } else {
        resolve('playlist');
      }
    });
    
    ytDlp.on('error', () => {
      clearTimeout(timeoutId);
      resolve('playlist');
    });
  });
};

// Check if cookies.txt file exists and is not empty
const hasCookies = () => {
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  if (fs.existsSync(cookiesPath)) {
    const content = fs.readFileSync(cookiesPath, 'utf8');
    // Check if file has actual cookie content (not just comments/instructions)
    return content.trim().length > 0 && 
           !content.includes('example.com') &&
           content.split('\n').some(line => 
             line.trim() && 
             !line.trim().startsWith('#') && 
             !line.trim().startsWith('//')
           );
  }
  return false;
};

const createDownloadDirectory = (format, isPlaylist = false, playlistName = null) => {
  const timestamp = new Date().toISOString().split('T')[0]; // Get only date part (YYYY-MM-DD)
  
  let baseDir;
  if (isPlaylist && playlistName) {
    // For playlists: download/{date}/{playlist_name}/
    baseDir = path.join(__dirname, 'download', timestamp, playlistName);
  } else {
    // For single files: downloaded-media/{format}/{timestamp}/
    const timePart = new Date().toISOString().replace(/[:.]/g, '-');
    baseDir = path.join(__dirname, 'downloaded-media', format.toUpperCase(), timePart);
  }
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  return baseDir;
};

const downloadVideo = (url, downloadDir, isPlaylist = false, format = 'mp4') => {
  return new Promise((resolve, reject) => {
    let errorOutput = '';
    const args = [
      '-o', `${downloadDir}/%(title)s.%(ext)s`,
      '--no-check-certificate' // Bypass SSL certificate verification (fixes macOS SSL issues)
    ];
    
    // Add playlist flag based on isPlaylist
    if (isPlaylist) {
      args.push('--yes-playlist');
    } else {
      args.push('--no-playlist');
    }
    
    // Add cookies if available
    if (hasCookies()) {
      args.push('--cookies', 'cookies.txt');
      console.log('Using cookies for authentication...');
    }
    
    // Add format-specific arguments
    if (format === 'wav') {
      args.push('--extract-audio');
      args.push('--audio-format', 'wav');
    } else {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    }
    
    args.push(url);
    
    const mediaType = isPlaylist ? 'playlist' : format === 'wav' ? 'audio' : 'video';
    console.log(`Downloading ${mediaType}...`);
    console.log(`Saving to: ${downloadDir}`);
    console.log(`Format: ${format.toUpperCase()}`);
    
    const ytDlp = spawn('yt-dlp', args);
    
    ytDlp.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    ytDlp.stderr.on('data', (data) => {
      const errorData = data.toString();
      console.error(errorData);
      errorOutput += errorData;
    });
    
    ytDlp.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const error = new Error(`yt-dlp process exited with code ${code}`);
        error.errorOutput = errorOutput;
        reject(error);
      }
    });
    
    ytDlp.on('error', (err) => {
      reject(err);
    });
  });
};

// Function to log errors to a file in the download directory
const logErrorToFile = (downloadDir, url, error) => {
  const errorLogPath = path.join(downloadDir, 'download_errors.log');
  const timestamp = new Date().toISOString();
  const errorMessage = `- Error when attempting this step.
URL: ${url}
Error log: \`${error}\`
Timestamp: ${timestamp}
\n`;
  
  fs.appendFileSync(errorLogPath, errorMessage, 'utf8');
  console.log(`Error logged to: ${errorLogPath}`);
};

const main = async () => {
  let downloadDir = null;
  let url = null;
  
  try {
    console.log('YouTube Media Downloader');
    console.log('========================');
    console.log('1. Video MP4');
    console.log('2. Video Playlist MP4');
    console.log('3. Audio WAV');
    console.log('4. Audio Playlist WAV');
    console.log('========================');
    
    const selection = await askQuestion('Select download type (1-4): ');
    
    let isPlaylist = false;
    let format = 'mp4';
    
    const options = {
      '1': { message: 'Video MP4' },
      '2': { message: 'Video Playlist MP4', isPlaylist: true },
      '3': { message: 'Audio WAV', format: 'wav' },
      '4': { message: 'Audio Playlist WAV', isPlaylist: true, format: 'wav' }
    };
    
    const selectedOption = options[selection];
    if (!selectedOption) {
      console.log('Invalid selection. Please enter a number between 1 and 4.');
      rl.close();
      return;
    }
    
    console.log(`You selected: ${selectedOption.message}`);
    isPlaylist = selectedOption.isPlaylist || false;
    format = selectedOption.format || 'mp4';
    
    url = await askQuestion('Enter the YouTube URL: ');
    
    if (!url) {
      console.log('No URL provided. Exiting.');
      rl.close();
      return;
    }
    
    // Extract playlist name if it's a playlist
    let playlistName = null;
    if (isPlaylist) {
      playlistName = await extractPlaylistName(url);
      if (!playlistName || playlistName === 'playlist') {
        console.log('Could not extract playlist name. Using generic name.');
        playlistName = 'unknown-playlist';
      }
    }
    
    downloadDir = createDownloadDirectory(format, isPlaylist, playlistName);
    
    await downloadVideo(url, downloadDir, isPlaylist, format);
    
    console.log('\nDownload completed successfully!');
    console.log(`Files saved in: ${downloadDir}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Log error to file if we have a download directory and URL
    if (downloadDir && url) {
      const errorLog = error.errorOutput || error.message;
      logErrorToFile(downloadDir, url, errorLog);
    }
  } finally {
    rl.close();
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nProcess interrupted. Exiting...');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nProcess terminated. Exiting...');
  rl.close();
  process.exit(0);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}