package com.palanas.portrait.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageService {

    private final Path storageDir = Paths.get("./backend-uploads");

    public ImageService() throws IOException {
        if (!Files.exists(storageDir)) Files.createDirectories(storageDir);
    }

    public String processAndSave(MultipartFile file) throws IOException {
        BufferedImage src = ImageIO.read(file.getInputStream());
        if (src == null) throw new IOException("Unsupported image format");

        // downscale for faster processing if very large
        int max = 1200;
        int w = src.getWidth();
        int h = src.getHeight();
        double scale = Math.min(1.0, (double) max / Math.max(w, h));
        if (scale < 1.0) {
            int nw = (int) (w * scale);
            int nh = (int) (h * scale);
            BufferedImage tmp = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = tmp.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(src, 0, 0, nw, nh, null);
            g.dispose();
            src = tmp;
        }

        BufferedImage gray = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics g = gray.getGraphics();
        g.drawImage(src, 0, 0, null);
        g.dispose();

        // simple edge detection (Sobel approximation)
        BufferedImage edges = sobelEdge(gray);

        // combine: draw a paper-colored background, then gray, then edges multiply
        BufferedImage out = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D og = out.createGraphics();
        og.setPaint(new Color(247,242,234));
        og.fillRect(0,0,out.getWidth(), out.getHeight());
        og.drawImage(gray, 0, 0, null);
        // multiply edges (simple draw with composite)
        og.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
        og.drawImage(edges, 0, 0, null);
        og.dispose();

        String filename = UUID.randomUUID().toString() + ".png";
        Path outPath = storageDir.resolve(filename);
        ImageIO.write(out, "PNG", outPath.toFile());
        return outPath.toAbsolutePath().toString();
    }

    /**
     * Save the uploaded image (optionally downscaled) without applying outline/edge processing.
     * Used for profile photos where users expect their original image to be preserved.
     */
    public String saveOriginal(MultipartFile file) throws IOException {
        BufferedImage src = ImageIO.read(file.getInputStream());
        if (src == null) throw new IOException("Unsupported image format");

        // downscale for storage if very large (same heuristic as processAndSave)
        int max = 1200;
        int w = src.getWidth();
        int h = src.getHeight();
        double scale = Math.min(1.0, (double) max / Math.max(w, h));
        if (scale < 1.0) {
            int nw = (int) (w * scale);
            int nh = (int) (h * scale);
            BufferedImage tmp = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = tmp.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(src, 0, 0, nw, nh, null);
            g.dispose();
            src = tmp;
        }

        String filename = UUID.randomUUID().toString() + ".png";
        Path outPath = storageDir.resolve(filename);
        ImageIO.write(src, "PNG", outPath.toFile());
        return outPath.toAbsolutePath().toString();
    }

    private BufferedImage sobelEdge(BufferedImage gray) {
        int w = gray.getWidth();
        int h = gray.getHeight();
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_BYTE_GRAY);

        int[] gx = {-1,0,1,-2,0,2,-1,0,1};
        int[] gy = {1,2,1,0,0,0,-1,-2,-1};

        for (int y = 1; y < h-1; y++) {
            for (int x = 1; x < w-1; x++) {
                int sumX = 0, sumY = 0;
                int idx = 0;
                for (int ky = -1; ky <= 1; ky++) {
                    for (int kx = -1; kx <= 1; kx++) {
                        int rgb = gray.getRGB(x+kx, y+ky) & 0xFF;
                        sumX += gx[idx] * rgb;
                        sumY += gy[idx] * rgb;
                        idx++;
                    }
                }
                int mag = (int) Math.min(255, Math.sqrt(sumX*sumX + sumY*sumY));
                int val = 255 - mag; // invert for sketch-like
                int rgb = (val<<16) | (val<<8) | val;
                out.setRGB(x,y,rgb);
            }
        }
        return out;
    }
}
