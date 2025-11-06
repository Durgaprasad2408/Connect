import jwt from "jsonwebtoken";

export function createAccessToken(user) {
  return jwt.sign({ sub: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

export function createRefreshToken(user, tokenId) {
  return jwt.sign({ sub: user._id, tid: tokenId }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
}
