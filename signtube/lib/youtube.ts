// Youtube utilities

export function extractVideoId(url: string): string | null {
  // Try to find typical v= parameter or youtu.be/ ID
  const matchObj = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return (matchObj && matchObj.length > 1) ? matchObj[1] : null;
}
