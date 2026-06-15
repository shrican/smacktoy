// ===========================
// GILLI DANDA - Renderer
// ===========================

// Extended rendering utilities
const renderer = {
    drawGradientCircle(ctx, x, y, radius, color1, color2) {
        const gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawText(ctx, text, x, y, size = 16, color = 'white', align = 'center') {
        ctx.font = `bold ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    },
    
    drawShadow(ctx, x, y, width, height, blur = 10) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    },
    
    clearShadow(ctx) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
};

// Enhanced rendering capabilities
class EnhancedRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
    }
    
    drawEnvironment(gameState) {
        // Sky with gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
        skyGradient.addColorStop(0, '#87ceeb');
        skyGradient.addColorStop(1, '#e0f6ff');
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);
        
        // Draw clouds
        this.drawClouds();
        
        // Ground
        this.ctx.fillStyle = '#8b7355';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Grass line
        this.ctx.strokeStyle = '#7a6b4d';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 50);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 50);
        this.ctx.stroke();
    }
    
    drawClouds() {
        const time = Date.now() / 50000;
        
        for (let i = 0; i < 3; i++) {
            const x = (this.canvas.width * (0.2 + i * 0.3) + time * this.canvas.width) % this.canvas.width;
            const y = 80 + i * 40;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.drawCloud(x, y, 40);
        }
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y - size * 0.4, size * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x - size * 0.6, y - size * 0.4, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
