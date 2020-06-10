module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        require('precss'),
        require('postcss-import'),
        require('cssnano')({
            preset: 'default',
        })
    ]
}
